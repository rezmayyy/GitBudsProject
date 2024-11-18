function Subscriptions(){

    const subscriptions = [
        {id: 1, name: "Sub1", avatar: "#"},
        {id: 2, name: "Sub2", avatar: "#"},
        {id: 3, name: "Sub3", avatar: "#"},
        {id: 4, name: "Sub4", avatar: "#"}

    ];

  // Dummy remove function for now
  const removeSubscription = (id) => {
    console.log(`Removing subscription with id: ${id}`);
  };

  return (
    <div className="subscriptions-list">
      <h4>Your Subscriptions</h4>
      <ul>
        {subscriptions.map((sub) => (
          <li key={sub.id}>
            <span>{sub.name}</span>
            <a href="#" className="remove-link" onClick={() => removeSubscription(sub.id)}>Remove</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Subscriptions
