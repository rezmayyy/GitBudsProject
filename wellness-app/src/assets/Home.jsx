import { useContext } from 'react';
import Subscriptions from './Subscriptions';
import UserContext from './UserContext';
import Signout from './Signout';

function Home() {
    const {user} = useContext(UserContext)
    return (
      <div className="Home">
  
          
  
          <main className="main-section">
  
            <div className="left-side">
              
              <Subscriptions/>
            </div>
  
            <div className="right-side">
            {user && <p>Signed in as: {user.displayName} <div><Signout/></div></p>}
            </div>
  
          </main>
  
          
  
      </div>
    );
  }
  
  export default Home;