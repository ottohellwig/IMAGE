const Cognito = require("@aws-sdk/client-cognito-identity-provider");
const { CognitoJwtVerifier } = require("aws-jwt-verify");
const jwt = require("jsonwebtoken");

const clientId = process.env.CLIENT_ID; // Obtain from the AWS console
const userPoolId = process.env.USER_POOL_ID; // Obtain from the AWS console
const JWT_SECRET = process.env.JWT_SECRET;

const client = new Cognito.CognitoIdentityProviderClient({
  region: "ap-southeast-2",
});

const accessVerifier = CognitoJwtVerifier.create({
  userPoolId: userPoolId,
  tokenUse: "access",
  clientId: clientId,
});

const idVerifier = CognitoJwtVerifier.create({
  userPoolId: userPoolId,
  tokenUse: "id",
  clientId: clientId,
});

module.exports = () => {
  const signup = async (req, res) => {
    const { username, password, email, isAdmin } = req.body;

    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ message: "Username, password, and email are required" });
    }

    const command = new Cognito.SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
    });

    try {
      const response = await client.send(command);

      // Assign user to group
      const groupCommand = new Cognito.AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: username,
        GroupName: isAdmin ? "Admin" : "User",
      });
      await client.send(groupCommand);

      res.json({
        message:
          "Signup successful. Please check your email to confirm your account.",
        response,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const command = new Cognito.InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
      ClientId: clientId,
    });

    try {
      const response = await client.send(command);
      const idToken = response.AuthenticationResult.IdToken;
      const accessToken = response.AuthenticationResult.AccessToken;

      // Verify tokens
      const idTokenVerifyResult = await idVerifier.verify(idToken);
      const accessTokenVerifyResult = await accessVerifier.verify(accessToken);

      // Decode the token to get user groups
      const decodedToken = jwt.decode(idToken, { complete: true });
      const groups = decodedToken.payload["cognito:groups"] || [];
      const isAdmin = groups.includes("Admin");

      res.cookie("token", idToken, { httpOnly: true });
      res.json({
        message: "Login successful",
        isAdmin,
        idTokenVerifyResult,
        accessTokenVerifyResult,
      });
    } catch (error) {
      res.status(401).json({ message: "Invalid username or password" });
    }
  };

  const confirmEmail = async (req, res) => {
    const { username, confirmationCode } = req.body;

    if (!username || !confirmationCode) {
      return res
        .status(400)
        .json({ message: "Username and confirmation code are required" });
    }

    const command = new Cognito.ConfirmSignUpCommand({
      ClientId: clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
    });

    try {
      const response = await client.send(command);
      res.json({ message: "Email confirmed successfully.", response });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  const logout = (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logout successful" });
  };

  return { signup, login, confirmEmail, logout };
};
