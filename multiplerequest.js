//how to copy an object in javascript
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
			 		email: "sample2@techmcq.com"
			 	}
			}

		];*/

	var request = req.body.request;
	if(!request){
		res.json("request not defined");
		return;
	}

	/*var routeName = "/dashboard"; 
	var method = "get";
	var querystring = {
		email: "abc@techmcq.com"
	}
	var body = {
		email: "xyz@techmcq.com"
	}*/

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
