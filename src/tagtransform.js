function Tagtransform(rules) {
	
	let self = new Object();
	self.name = "tagtransform";
	sections = ["keyRename", "implicitTagging"];
	
	if (typeof(rules) == "object" && Object.keys(rules).length == 0) {
		console.error("Argument needs to be a dictionary (Key-Value-Map) filled with key-value pairs.");
		return "ARG_NOT_DICTIONARY";
	}
	
	function validateJsonInput(jsonInput) {
		if (typeof(jsonInput) == "object" && Object.keys(jsonInput).length == 0) {
			console.error("Argument needs to be a dictionary (Key-Value-Map)");
			return false;
		}
		return true;
	}
	
	function deepCopyJson(json) {
		return JSON.parse(JSON.stringify(json));
	}
	
	function simple(transformerName, jsonInput, callback) {
		if (validateJsonInput(jsonInput)) {
			return false;
		}
		
		let jsonOutput = deepCopyJson(jsonInput)
		let section = sections[transformerName];
		
		if (section == undefined) {
			console.error("transformer '" + transformerName + "' needs to be available for this.")
			return false;
		}
		
		for (let key in jsonInput) {
			if (rules[section][key] != undefined) {
				callback(key, rules[key], jsonInput, jsonOutput);
			}
		}
		
		return jsonOutput;
	}
	self.simple = simple;
	
	function simpleKeyRename(jsonInput) {
		return simple("keyRename",
			jsonInput,
			function (oldKey, newKey, jsonInput, jsonOutput) {
				jsonOutput[newKey] = jsonInput[oldKey];
				delete jsonOutput[oldKey];
				return jsonOutput
			}
		);
	}
	self.simpleKeyRename = simpleKeyRename;
	
	function simpleImplicitTagging(jsonInput) {
		return simple("implicitTagging",
			jsonInput,
			function (key, implicit, jsonInput, jsonOutput) {
				for (let i in implicit) {
					jsonOutput[i] = implicit[i];
				}
				return jsonOutput;
			}
		);
	}
	self.simpleImplicitTagging = simpleImplicitTagging;
	
	function transform(jsonInput) {
		if (validateJsonInput(jsonInput)) {
			return false;
		}
		
		for (let func of [simpleKeyRename, simpleImplicitTagging]) {
			jsonInput = func(jsonInput);
		}
		
		return jsonInput;
	}
	self.transform = transform;
	
	return self;
}

function tagtransformLoadReferences(rules) {
	let system = TagtransformSystemInternals();
	
	async function sendFetch(url, callback, callbargs=[]) {
		if (!args.body) {
			args.body = "";
		}
		
		let result;
		console.info(url=;
		let response = await fetch(url, {"method": "GET", "credentials": "include", "headers": {"Content-Type": "application/json"}});
		result = await response.json();
		if (callbargs.length == 0) {
			callback(result);
		} else {
			callback(result, callbargs)
		}
	}
	
	function load(callb, callbargs) {
		if (system.getObjectType(rules) == "object") {
			return Tagtransform(rules);
		}
		
		if (callbargs == undefined) {
			sendFetch(rules, callb);
		} else {
			sendFetch(rules, callb, callbargs);
		}
	}
}

function TagtransformSystemInternals() {
	let self = new Object();
	
	function getObjectType(obj) {
		if (typeof(obj) != "object") {
			return typeof(obj);
		}
		
		if (obj.push != undefined && obj.slice != undefined && obj.join != undefined) {
			return "array";
		}
		return "object"
	}
}
