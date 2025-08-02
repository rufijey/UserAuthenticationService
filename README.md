## Part 2

We can use Redis to cache user data and to create a limiter that prevents spam requests. For operations such as sending emails, we can use queues, for example, on the same Redis. We can also scale horizontally both the API by creating multiple instances and using a load balancer, and the database by using replication or sharding.

## Part 3

First, the client contacts an external service and logs in there. The external service returns an authorization code, which the client sends to our API.
Our API exchanges this code for an access token, then uses that token to get the user’s information. After that, we check whether this user is already registered in our database. 
If not, we create a new user. Finally, we generate a JWT and send it back to the client.

diagram link: https://drive.google.com/file/d/16SWM9y4T7h7isdLssQ59fzvCgTjEpnOg/view?usp=sharing
