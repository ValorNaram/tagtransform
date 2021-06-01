function TagtransformRecorder() {
	let self = new Object();
	let added = {};
	let removed = {};
	let modified = {};
	
	self.type = "recorder";
	
	function add(key, value) {
		added[key] = value;
	}
	self.add = add;
	
	function remove(key, value) {
		removed[key] = value;
	}
	self.remove = remove;
	
	function modify(key, oldvalue, newvalue) {
		modified[key] = {"old": oldvalue, "new": newvalue};
	}
	self.modify = modify;
	
	function getDiff() {
		return {"added": added, "removed": removed, "modified": modified};
	}
	self.getDiff = getDiff;
}

function Tagtransform(transforms, recorder) {
	let self = new Object();
	let transformers = ["keyRename", "implicitTagging"]
	let recorderEnabled = false;
	
	if (typeof(transforms) == "object" && Object.keys(transforms).length == 0) {
		console.error("Argument needs to be a dictionary (Key-Value-Map) filled with key-value pairs.");
		return "ARG_NOT_DICTIONARY";
	}
	
	if (typeof(recorder) == "object" && recorder.type == "recorder") {
		recorderEnabled = true;
	}
	
	function validateJsonInput(jsonInput) {
		if (typeof(transforms) == "object" && Object.keys(transforms).length == 0) {
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
		let transformer = transformers[transformerName];
		
		if (transformer == undefined) {
			console.error("transformer '" + transformerName + "' needs to be available for this.")
			return false;
		}
		
		for (let key in jsonInput) {
			if (transformers[key] != undefined) {
				callback(key, transformers[key], jsonInput, jsonOutput);
			}
		}
		
		return jsonOutput;
	}
	self.simple = simple;
	
	function simpleKeyRename(jsonInput) {
		return simple("keyRename",
			jsonInput,
			function (key, value, jsonInput, jsonOutput) {
				jsonOutput[value] = jsonInput[key];
				delete jsonOutput[key];
				if (recorderEnabled) {
					recorder.added(key, jsonInput[key]);
					recorder.removed(key, jsonInput[key]);
				}
				return jsonOutput
			}
		);
	}
	self.simpleKeyRename = simpleKeyRename;
	
	function simpleImplicitTagging(jsonInput) {
		return simple("implicitTagging",
			jsonInput,
			function (key, value, jsonInput, jsonOutput) {
				let dict = transformers[key]
				
				for (let i in dict) {
					jsonOutput[i] = dict[i];
					if (recorderEnabled) {
						recorder.added(i, dict[i]);
					}
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

function tagtransformLoadReferences(transforms) {
	let self = new Object();
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
		if (system.getObjectType(transforms) == "object") {
			return Tagtransform(transforms);
		}
		
		if (callbargs == undefined) {
			sendFetch(transforms, callb);
		} else {
			sendFetch(transforms, callb, callbargs);
		}
	}
	self.load = load;
	
	return self;
	
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
	self.getObjectType = getObjectType;
	
	return self;
}
