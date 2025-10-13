import { Button, DownloadTrigger } from "@chakra-ui/react";

function Login() {
  return (
    <>
      <div>Login Page</div>
      <Button size="xl" colorPalette="teal">
        Click Me!!!
      </Button>

      <a href="/Home">Home</a>
      <a href="/SignUp">Sign Up</a>
    </>
  );
}

export default Login;
