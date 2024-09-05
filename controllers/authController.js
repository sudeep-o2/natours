// const util = require('util')
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    // passwordChangedAt: req.body.passwordChangedAt,
  });

  sendToken(newUser, 201, res);
  // const token = signToken(newUser._id);

  // // console.log(newUser);
  // // console.log(token);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // (1) check if email and password is entered
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //(2)verify email and passwpord if exist
  const user = await User.findOne({ email }).select('+password');
  // console.log(user);

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Email or Password is Incorrect', 401));
  // (3) if everything ok send token
  sendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  //(1) get token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // console.log(token);

  if (!token) {
    return next(new AppError('you are not logged in , please log in ', 401));
  }

  //(2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //  imp
  // console.log(decoded);

  //(3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  // console.log(freshUser);
  if (!currentUser) {
    return next(new AppError('The user of this token no longer exist ', 401));
  }
  //(4) check if user changed password after token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password changed recently, please login again', 401),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  //(1) get token and check if it's there
  if (req.cookies.jwt) {
    try {
      //(2) verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      ); //  imp
      // console.log(decoded);

      //(3) check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      //(4) check if user changed password after token was issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a loggen in user
      res.locals.user = currentUser; // res.locals will provide user object in all templates
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('you do not have permission ', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //(1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('User does not exist with the provided email id', 404),
    );
  }
  //(2) Generate random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  //(3) send it to users email
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`;
  const message = `Forgot your password , submit a patch request with your new password and confirm password to
  ${resetURL}\n If you didn't forgot your password , please ignore the email `;

  try {
    await sendEmail({
      email: user.email,
      subject: `Your password reset token , valid for 10 min ${message}`,
      body: message,
    });
    res.status(200).json({
      status: 'success',
      message: 'token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending email, try again later', 500),
    );
  }
});

exports.resetforgotPassword = catchAsync(async (req, res, next) => {
  //(1) get user based on token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //(2) if token is not expired and user is available set new password

  if (!user) {
    return next(new AppError('token is expired or invalid', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // (3) if evrything ok send token to client

  sendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //(1) get user
  const user = await User.findById(req.user.id).select('+password');

  //(2) check posted password
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('the current password is incorrect ', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  //(3) update password
  await user.save();

  //(4) login user
  sendToken(user, 200, res);
});
