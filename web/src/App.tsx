import { useEffect, useState } from "react";
import "./App.css";
import ConnectionComponent from "./components/ConnectionComponent";
import { getAccessToken } from "./lib/auth";
import LoginComponent from "./components/LoginComponent";

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    getAccessToken().then(
      () => setLoggedIn(true),
      () => setLoggedIn(false),
    );
  }, []);

  if (loggedIn === null) return <p className="m-8">Loading...</p>;
  if (!loggedIn) return <LoginComponent onLogin={() => setLoggedIn(true)} />;
  return <ConnectionComponent />;
}

export default App;
