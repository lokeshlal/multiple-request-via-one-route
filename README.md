# multiple-request-via-one-route

Note: Below methods is based on express server module.

Call multiple routes from a single route in express - node.js

While building Web API, most of the times we encounter situation where we need to stuff data from multiple places into single call to avoid multiple calls from client to server.

however a single Web API call should only return data for one context. for example, list of hobbies, should not have details of user who have interest in those hobbies.

for example
```
[
    {
        name: "dancing",
        userData: {
            isMyHobby: true,
            levelOfInterest: "high"
        }
    },
    ...
]
```

Ideally the data above should be served in two different request.

We faced a similar issue while working on a node.js Web API.

To solve this problem and to avoid multiple calls from client to server. We created a route, that will take multiple requests and process the result and send the result in the same order.

For this we cloned the express response object and instead of passing actual request object, we created a new request object to be passed to a every route that will process all the request and return the results in same order.

Sample request object will look like this

```
req.body.requests = [
    {
        url: "/getuser",
        method: [get|post|put]
        querystring: {
            email: 'abc@sample.com'
        },
        body: {
            email: 'abc@sample.com',
            id: 1,
            ...
        }
    },
    {
        ...
    }
]
```

to extend the response object, that we will pass to every route, we will use following method.
```
function extend(obj) {
    _.each(Array.prototype.slice.call(arguments, 1), function(source) {
        if (source) {
            for (var prop in source) {
                if(prop == "host"){
                    continue;
                }
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};
```

Route that will handle multiple request will be

```
app.get('/multiplerequests', function(req, res){
 
    /*
    REFERENCE CODE FOR REQUEST
    var request = [
            {
                url: "/dashboard",
                method: "get",
                querystring: {
                    email: "sample@techmcq.com"
                }
            },
            {
                url: "/dashboard",
                method: "get",
                querystring: {
                    email: "sample1@techmcq.com"
                }
            },
            {
                url: "/dashboard",
                method: "get",
                querystring: {
                    email: "sample1@techmcq.com"
                }
            }
 
        ];*/
 
    var request = req.body.request;
    if(!request){
        res.json("request not defined");
        return;
    }
 
    var count = 0;
 
    var routesToBeProcessed = [];
    request.forEach(function(r){
 
        var rmethod = r.method;
        if(!rmethod){
            rmethod = "get";
        }
         
        var routesToCallPerRequest = _.filter(app._router.stack, function(s){
            if(r.url.match(s.regexp) && r.url.match(s.regexp) != null && r.url.match(s.regexp).length > 0 && r.url.match(s.regexp).join().length > 6) {
                if(s.route.methods[rmethod] == true){
                    return true;
                }
            }
        });
 
        var routesSeenPerRequest = [];
        var routesToBeProcessedPerRequest = [];
 
        if(routesToCallPerRequest.length == 0){
            res.json('route url is incorrect or not defined');
            return;
        }
 
        routesToCallPerRequest.forEach(function(route){
            if(!_.contains(routesSeenPerRequest, route.regexp.toString())){
                routesSeenPerRequest.push(route.regexp.toString());
                routesToBeProcessedPerRequest.push(route);
            }
        });
 
        routesToBeProcessed = routesToBeProcessed.concat(routesToBeProcessedPerRequest);
    });
     
     
    var returnObj = {};
 
    if(routesToBeProcessed.length > 0){
        var count = 0;
 
        var totalReq = routesToBeProcessed.length;
 
        routesToBeProcessed.forEach(function(route){
 
            var mynumber = 0;
            (function(_c){
                mynumber = _c; //descoping count
            })(count);
 
            var _res = extend({}, res);
 
            //CREATE A NEW REQUEST OBJECT FOR ALL INDIVDUAL REQUESTS
            var newRequestObject = {};
            newRequestObject.session = req.session;
            newRequestObject.query = {};
            newRequestObject.body = {};
            newRequestObject.method = req.method;
 
            //GET REQUEST DATA FOR CURRENT REQUEST
            var request_ = request[mynumber];
 
            for(i in request_.querystring){
                newRequestObject.query[i] = request_.querystring[i];
            }
 
            for(i in request_.body){
                newRequestObject.body[i] = request_.body[i];
            }
 
            //json method to capture the route response
            //and store in returnObj array
            _res.json = function(response){
                returnObj[mynumber] = response;
                if(totalReq == Object.getOwnPropertyNames(returnObj).length){
                    //ALL REQUEST PROCESSED
                    //RETURN THE FINAL RESULT SET
                    var returnArray = [];
                    for(i in returnObj){
                        returnArray.push(returnObj[i]);
                    }
                    res.json(returnArray);
 
                    return;
                }
            }
            //CALL ROUTE FOR SINGLE REQUEST
            route.handle(newRequestObject, _res, function(){
            })
            count++;
        });
    }
});
```



