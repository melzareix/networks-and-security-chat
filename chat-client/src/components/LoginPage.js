import React from 'react';
import ReactSignupLoginComponent from 'react-signup-login-component';

const LoginPage = (props) => {
  const recoverPasswordWasClickedCallback = (data) => {
    console.log(data);
  };
  return (
      <div>
          <ReactSignupLoginComponent
              title="New Chat"
              handleSignup={props.handleSignup}
              handleLogin={props.handleLogin}
              handleRecoverPassword={recoverPasswordWasClickedCallback}
              goToLoginCustomLabel={'Login?'}
              submitLoginCustomLabel={'Login'}
          />
      </div>
  );
};

export default LoginPage;
