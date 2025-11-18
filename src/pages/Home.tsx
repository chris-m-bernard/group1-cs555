import {Link} from "react-router-dom"
import {routes} from "../routes"

function Home() {
  return (
    <>
      <div>Home Page</div>
      <p>Hellowdgsdfg</p>
      <Link to={routes.auth}>Sign Up / Login</Link>
    </>
  );
}

export default Home;
