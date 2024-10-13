import { useLocation } from "react-router-dom";

function Subscriptions(){

    const subscriptions = [
        {id: 1, name: "Sub1", avatar: "#"},
        {id: 2, name: "Sub2", avatar: "#"},
        {id: 3, name: "Sub3", avatar: "#"},
        {id: 4, name: "Sub4", avatar: "#"}

    ];

    const location = useLocation();
    if(location.pathname != '/')
        return null;

    return(

        <section className="subscriptions">
            <h3>Your Subscriptions</h3>
            <ul>
                {subscriptions.map(subscription =>(
                    <li key={subscription.id} className="subscription-item">
                        <img src={subscription.avatar} alt={subscription.name} className="avatar" />
                    </li>
                ))}
            </ul>
            <hr></hr>
        </section>
        

    );
}

export default Subscriptions