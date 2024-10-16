import Subscriptions from './Subscriptions';

function Home() {
    return (
      <main>
        <div id="subscriptions">
          <Subscriptions />
        </div>
        <div id="latest-content">
          <div className="card">Content 1</div>
          <div className="card">Content 2</div>
          <div className="card">Content 3</div>
          <div className="card">Content 4</div>
          <div className="card">Content 5</div>
          <div className="card">Content 6</div>
        </div>
      </main>
    );
  }
  
  export default Home;


