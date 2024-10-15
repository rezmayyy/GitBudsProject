import { useContext } from 'react';
import Subscriptions from './Subscriptions';
import UserContext from './UserContext';

function Home() {
    const {user, displayName} = useContext(UserContext)
    return (
      <div className="Home">
  
          
  
          <main className="main-section">
  
            <div className="left-side">
              
              <Subscriptions/>
            </div>
  
            <div className="right-side">
            {user && <p>Signed in as: {user.email}</p>}
            </div>
  
          </main>
  
          
  
      </div>
    );
  }
  
  export default Home;