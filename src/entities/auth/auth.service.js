import User from './auth.model.js';
import jwt from 'jsonwebtoken';
import { refreshTokenSecrete, emailExpires } from '../../core/config/config.js';
import sendEmail from '../../lib/sendEmail.js';
import verificationCodeTemplate from '../../lib/emailTemplates.js';
import { validatePasswordStrength } from './passwordRules.js';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

const generateOtp = () =>
  String(Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * 9 * 10 ** (OTP_LENGTH - 1)));

const getOtpExpiryDate = () => new Date(Date.now() + emailExpires);

const maskEmail = (email) => {
  const [localPart = '', domain = ''] = email.split('@');
  if (!localPart || !domain) return email;

  const visiblePart =
    localPart.length <= 2
      ? `${localPart[0] || ''}*`
      : `${localPart.slice(0, 2)}${'*'.repeat(Math.max(1, localPart.length - 2))}`;

  return `${visiblePart}@${domain}`;
};

const getVerificationMeta = (email) => ({
  email,
  maskedEmail: maskEmail(email),
  expiresInMinutes: Math.ceil(emailExpires / (60 * 1000)),
  resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
});

const sendVerificationOtpEmail = async ({ email, otp, subject = 'Verify your email' }) => {
  const emailResult = await sendEmail({
    to: email,
    subject,
    html: verificationCodeTemplate(otp),
  });

  if (!emailResult?.success) {
    throw new Error('Failed to send verification email');
  }
};

const normalizeEmail = (email) => email?.trim().toLowerCase();
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildEmailQuery = (email) => ({
  email: new RegExp(`^${escapeRegExp(email)}$`, 'i'),
});

const attachVerificationOtp = (user) => {
  user.otp = generateOtp();
  user.otpExpires = getOtpExpiryDate();
  user.otpVerified = false;
};

// export const registerUserService = async ({
//   name,
//   email,
//   password
// }) => {
//   const existingUser = await User.findOne({ email });
//   if (existingUser) throw new Error('User already registered.');

//   const newUser = new User({
//     name,
//     email,
//     password,
//   });

//   const user = await newUser.save();

//   const { _id, role, profileImage } = user;
//   return { _id, name, email, role,  profileImage };
// };


// ✅ Modified registerUserService — send OTP after register
export const registerUserService = async ({
  name,
  firstName,
  lastName,
  email,
  password,
}) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');
  validatePasswordStrength(password);

  const existingUser = await User.findOne(buildEmailQuery(normalizedEmail));
  if (existingUser) throw new Error('User already registered.');

  const safeFirstName = firstName?.trim() || '';
  const safeLastName = lastName?.trim() || '';
  const displayName =
    name?.trim() || [safeFirstName, safeLastName].filter(Boolean).join(' ');

  const newUser = new User({
    name: displayName,
    firstName: safeFirstName,
    lastName: safeLastName,
    email: normalizedEmail,
    password,
    otpVerified: false,
    isVerified: false,
  });

  attachVerificationOtp(newUser);
  const user = await newUser.save();

  await sendVerificationOtpEmail({
    email: normalizedEmail,
    otp: user.otp,
  });

  return {
    ...getVerificationMeta(normalizedEmail),
    verificationRequired: true,
  };
};


// ✅ New — verifyEmailService (reuses existing otp fields on the model)
export const verifyEmailService = async ({ email, otp }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !otp) throw new Error('Email and otp are required');

  const user = await User.findOne(buildEmailQuery(normalizedEmail));
  if (!user)                          throw new Error('Invalid email');

  if (user.isVerified) {
    user.otp = null;
    user.otpExpires = null;
    user.otpVerified = true;
    await user.save({ validateBeforeSave: false });

    return {
      email: user.email,
      isVerified: true,
    };
  }

  if (!user.otp || !user.otpExpires)  throw new Error('Otp not found');

  if (
    parseInt(user.otp, 10) !== parseInt(otp, 10) ||
    Date.now() > user.otpExpires.getTime()
  ) {
    throw new Error('Invalid or expired otp');
  }

  user.otp        = null;
  user.otpExpires = null;
  user.otpVerified = true;
  user.isVerified  = true;   // ✅ Mark email as verified

  await user.save({ validateBeforeSave: false });

  return {
    email: user.email,
    isVerified: user.isVerified,
  };
};

export const resendVerificationEmailService = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');

  const user = await User.findOne(buildEmailQuery(normalizedEmail));
  if (!user) throw new Error('Invalid email');
  if (user.isVerified) throw new Error('Email already verified');

  attachVerificationOtp(user);
  await user.save({ validateBeforeSave: false });

  await sendVerificationOtpEmail({
    email: user.email,
    otp: user.otp,
  });

  return getVerificationMeta(user.email);
};

export const loginUserService = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !password) throw new Error('Email and password are required');

  const user = await User.findOne(buildEmailQuery(normalizedEmail)).select(
    '_id name firstName lastName email role profileImage isVerified otpVerified otp otpExpires',
  );

  if (!user) throw new Error('User not found');

  const isMatch = await user.comparePassword(user._id, password);
  if (!isMatch) throw new Error('Invalid password');

  // Self-heal legacy accounts where OTP verification succeeded but isVerified
  // was not persisted consistently.
  if (!user.isVerified && user.otpVerified) {
    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save({ validateBeforeSave: false });
  }

  if (!user.isVerified) {
    const verificationError = new Error('Email verification required');
    verificationError.statusCode = 403;
    verificationError.data = {
      ...getVerificationMeta(user.email),
      verificationRequired: true,
    };
    throw verificationError;
  }

  const payload = { _id: user._id, role: user.role };
  const refreshToken = user.generateRefreshToken(payload);

  const data = {
    user,
    accessToken: user.generateAccessToken(payload),
    refreshToken,
  };

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return data
};


export const refreshAccessTokenService = async (refreshToken) => {
  if (!refreshToken) throw new Error('No refresh token provided');

  const user = await User.findOne({ refreshToken });

  if (!user) throw new Error('Invalid refresh token');

  const decoded = jwt.verify(refreshToken, refreshTokenSecrete)

  if (!decoded || decoded._id !== user._id.toString()) throw new Error('Invalid refresh token')

  const payload = { _id: user._id , role: user.role }

  const accessToken = user.generateAccessToken(payload);
  const newRefreshToken = user.generateRefreshToken(payload);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false })

  return {
    accessToken,
    refreshToken: newRefreshToken
  }
};


export const forgetPasswordService = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error('Email is required');

  const user = await User.findOne(buildEmailQuery(normalizedEmail));
  if (!user) throw new Error('Invalid email');

  attachVerificationOtp(user);
  user.resetExpires = null;

  await user.save({ validateBeforeSave: false });

  const emailResult = await sendEmail({
    to: email,
    subject: 'Password Reset OTP',
    html: verificationCodeTemplate(user.otp),
  });

  if (!emailResult?.success) {
    throw new Error('Failed to send verification email');
  }

  return;
};


export const verifyCodeService = async ({ email, otp }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !otp) throw new Error('Email and otp are required');

  const user = await User.findOne(buildEmailQuery(normalizedEmail));
  if (!user) throw new Error('Invalid email');

  if (!user.otp || !user.otpExpires) throw new Error('Otp not found');

  if (
    parseInt(user.otp, 10) !== parseInt(otp, 10) ||
    Date.now() > user.otpExpires.getTime()
  ) {
    throw new Error('Invalid or expired otp');
  }

  user.otp = null;
  user.otpExpires = null;
  user.otpVerified = true;
  user.resetExpires = new Date(Date.now() + 15 * 60 * 1000); 

  await user.save({ validateBeforeSave: false });

  return;
};


export const resetPasswordService = async ({ email, newPassword }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !newPassword)
    throw new Error('Email and new password are required');
  validatePasswordStrength(newPassword);

  const user = await User.findOne(buildEmailQuery(normalizedEmail));
  if (!user) throw new Error('Invalid email');

  if (!user.otpVerified || !user.resetExpires) {
    throw new Error('otp not cleared');
  }

  if (Date.now() > user.resetExpires.getTime()) {
    throw new Error('Reset session expired');
  }

  user.password = newPassword;
  user.otpVerified = false;
  user.resetExpires = null;

  await user.save();

  return;
};


export const changePasswordService = async ({ userId, oldPassword, newPassword }) => {
  if (!userId || !oldPassword || !newPassword) throw new Error('User id, old password and new password are required');
  validatePasswordStrength(newPassword);

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const isMatch = await user.comparePassword(userId, oldPassword);
  if (!isMatch) throw new Error('Invalid old password');

  user.password = newPassword;
  await user.save();

  return;
};
