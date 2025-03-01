import {
  generateStreamTokens,
  login,
  refreshTokens,
  resendCode,
  signup,
  verifyCode,
} from "./authAPI";

const authResolver = {
  Query: {
    streamTokens: generateStreamTokens,
  },
  Mutation: {
    signup: signup,
    login: login,
    resendCode: resendCode,
    verifyCode: verifyCode,
    refreshTokens: refreshTokens,
  },
  AuthPayload: {
    __resolveType: (value: any) => {
      if (value.idToken) {
        return "AuthTokens";
      } else if (value.code) {
        return "AuthMessage";
      }
      return null;
    },
  },
};

export default authResolver;
