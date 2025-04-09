import React from 'react';
import Subscriptions from '../Home/Subscriptions'; // Adjust path as needed

function Following() {
    return (
        <div className="following-page">
            <h1>Your Following</h1>
            <Subscriptions />
            <style>{`
        /* Following.css - Revamped Design with Horizontal Layout */

        .following-page {
          max-width: 1200px;
          margin: 40px auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .following-page h1 {
          text-align: center;
          margin-bottom: 30px;
          font-size: 2.5em;
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(90deg, #ff6f61, #4facfe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        /* Transform the subscriptions list into a grid of channel cards */
        .subscriptions-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        /* Subscription item styled as a horizontal card with remove button on the right */
        .subscription-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 15px;
          background: #fafafa;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .subscription-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .subscription-item img {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          margin-right: 10px;
          border: 2px solid #4facfe;
        }
        .subscription-item .sub-info {
          flex-grow: 1;
          font-size: 1em;
          font-weight: bold;
          color: #333;
        }
        .subscription-item button {
          margin-left: 10px;
          padding: 6px 12px;
          font-size: 0.9em;
          background-color: #00c6ff;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }
        .subscription-item button:hover {
          background-color: #4facfe;
        }
      `}</style>
        </div>
    );
}

export default Following;
