# CareerBackendFinal
A backend final project for the software career track champ program

## External Tools

* Git
* Node
* Postman (Testing)

## Setting up
### Database
Since the backend code need a database to function and is not specified I decided to use the Redis cloud database

Create a redis account for a cloud data base and retrieve the 
1. Public endpoint as host name (not including the colon and five number after .com)
2. Default user password as password
3. Specify the Port connected to the database (the five numbers at the end of Public endpoint)

Enter all three parameter into the .env file (I have provided a templete in the env.local file)

### API set up
install dependency with:
```
npm i
```
and start the server with:
```
node index.js
```
after running the command the API should be avaliable on http://localhost:8000/.

## Testing the API with Postman
[![Run in Postman](https://run.pstmn.io/button.svg)](https://god.postman.co/run-collection/12662097-d4849c2c-25e2-47d0-b6f9-5767e24dd8bc?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D12662097-d4849c2c-25e2-47d0-b6f9-5767e24dd8bc%26entityType%3Dcollection%26workspaceId%3D6f2769ce-fe76-4f0e-815a-208942736aa1#?env%5BNew%20Environment%5D=W3sia2V5IjoiYmFzZVVybCIsInZhbHVlIjoibG9jYWxob3N0OjgwMDAiLCJlbmFibGVkIjp0cnVlLCJ0eXBlIjoiZGVmYXVsdCIsInNlc3Npb25WYWx1ZSI6ImxvY2FsaG9zdDo4MDAwIiwic2Vzc2lvbkluZGV4IjowfV0=)

