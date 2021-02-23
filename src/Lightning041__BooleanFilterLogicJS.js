(function (a) {
	a.BFL || (a.BFL = function () {}, a.BFL.getLabel = function () {
		return a.BFL.getLabelWithArray.apply(a.BFL, arguments)
	}, a.BFL.getLabelWithArray = function () {
		var c = Array.prototype.slice.call(arguments),
			b = "";
		if (2 > c.length) return b;
		a.BFL.labels ? b = a.BFL.labels[c[0]][c[1]] : "undefined" != typeof $A && (b = $A.get("$Label." + c[0] + "." + c[1]));
		return a.BFL._substituteVariables(b, c.slice(2))
	}, a.BFL._substituteVariables = function (a, b) {
		for (var d = 0; d < b.length; d++) a = a.replace(RegExp("\\{" + d + "\\}", "g"), b[d]);
		return a
	});
})(this);


BFL.labels = {
	'ErrorBooleanFilter': {
		'error_bad_number': 'The filter logic references an undefined filter: {0}.',
		'error_generic': 'Your filter is imprecise or incorrect. Please see the help for tips on filter logic.',
		'error_missing_left_operand': 'Your filter is missing left operand to {0}.',
		'error_missing_operand': 'Your filter is missing an operand.',
		'error_missing_operation': 'Your filter is missing an operation.',
		'error_missing_right_operand': 'Your filter is missing right operand to AND or OR.',
		'error_paren': 'Your filter is missing a parenthesis.',
		'error_typo': 'Check the spelling in your filter logic.',
		'error_unused_filters1': 'Filter conditions {0} are defined but not referenced in your filter logic.',
		'requiredFieldError': 'You must enter a value.'
	}
};

booleanfiltertokenizer = {
	LPAREN_ID: 0,
	RPAREN_ID: 1,
	AND_ID: 2,
	OR_ID: 3,
	NOT_ID: 4,
	INTEGER_ID: 5,
	LPAREN: function () {
		this.id = booleanfiltertokenizer.LPAREN_ID
	},
	RPAREN: function () {
		this.id = booleanfiltertokenizer.RPAREN_ID
	},
	AND: function () {
		this.id = booleanfiltertokenizer.AND_ID;
		this.operation = "AND"
	},
	OR: function () {
		this.id = booleanfiltertokenizer.OR_ID;
		this.operation = "OR"
	},
	NOT: function () {
		this.id = booleanfiltertokenizer.NOT_ID;
		this.operation = "NOT"
	},
	INTEGER: function (a) {
		this.id = booleanfiltertokenizer.INTEGER_ID;
		this.value = parseInt(a, 10)
	},
	TokenParsingException: function () {
		this.message = BFL.getLabel("ErrorBooleanFilter", "error_typo")
	},
	ParenMismatchException: function () {
		this.message = BFL.getLabel("ErrorBooleanFilter", "error_typo")
	},
	TooManyValuesException: function () {
		this.message = BFL.getLabel("ErrorBooleanFilter", "error_typo")
	},
	UnexpectedTokenException: function () {
		this.message = BFL.getLabel("ErrorBooleanFilter",
			"error_typo")
	},
	EmptyInputException: function () {
		this.message = BFL.getLabel("ErrorBooleanFilter", "requiredFieldError")
	},
	MissingOperandException: function (a) {
		this.message = BFL.getLabel("ErrorBooleanFilter", "error_typo")
	},
	EndOfTokensException: function () {
		this.message = BFL.getLabel("ErrorBooleanFilter", "error_typo")
	},
	Parser: function (a) {
		this.input = a
	},
	Node: function (a, b, c) {
		this.left = a;
		this.op = b;
		this.right = c
	}
};

booleanfiltertokenizer.Parser.prototype = {
	getTokens: function () {
		var a = [],
			b = /\d+/g,
			c = this.input.match(/\s+|\w+|\d+|\(|\)|\W+/g);
		if (!c) throw new booleanfiltertokenizer.MissingOperandException;
		for (var e = 0; e < c.length; e++) {
			var d = c[e].trim(),
				f = d.match(b);
			if ("(" === d) a.push(new booleanfiltertokenizer.LPAREN);
			else if (")" === d) a.push(new booleanfiltertokenizer.RPAREN);
			else if ("AND" === d.toUpperCase()) a.push(new booleanfiltertokenizer.AND);
			else if ("OR" === d.toUpperCase()) a.push(new booleanfiltertokenizer.OR);
			else if ("NOT" === d.toUpperCase()) a.push(new booleanfiltertokenizer.NOT);
			else if (f && 1 == f.length && f[0] === d) a.push(new booleanfiltertokenizer.INTEGER(d));
			else if (!(d.match(/\s+/i) || "" === d)) throw new booleanfiltertokenizer.TokenParsingException;
		}
		return a
	},
	getTree: function () {
		if (!this.allowEmpty && (!this.input || "undefined" === this.input.replace(/\s+/i, "")))
			throw new booleanfiltertokenizer.EmptyInputException;
		var a = this.getTokens(),
			b = [];
		this.index = 0;
		a = this._exp(a, b);
		if (0 < b.length) throw new booleanfiltertokenizer.TooManyValuesException;
		return a
	},
	getFilterNumbers: function () {
		for (var a = this.getTree(), b = {}; a instanceof booleanfiltertokenizer.Node;) null !== a.left && (b[a.left] = 0), a = a.right;
		!(a instanceof booleanfiltertokenizer.Node) && null !== a && (b[a] = 0);
		return b
	},
	getFiltersInUseMessage: function (a) {
		for (var b = this.getFilterNumbers(), c = [], e = [], d = 0; d < a.length; d++)
			"undefined" === typeof b[a[d]] ? c.push(a[d]) : b[a[d]]++;

		for (var f in b) b[f] || e.push(f);
		return 0 < c.length ? BFL.getLabel("ErrorBooleanFilter", "error_unused_filters1", c.join(",")) : 0 < e.length ? BFL.getLabel("ErrorBooleanFilter", "error_bad_number", e.join(",")) : null
	},
	_exp: function (a, b) {
		if (this.index >= a.length) throw new booleanfiltertokenizer.EndOfTokensException;
		for (; this.index < a.length;) {
			var c = a[this.index];
			this.index++;
			switch (c.id) {
				case booleanfiltertokenizer.INTEGER_ID:
					b.push(c.value);
					break;
				case booleanfiltertokenizer.LPAREN_ID:
					b.push("(");
					break;
				case booleanfiltertokenizer.RPAREN_ID:
					if (2 > b.length) throw new booleanfiltertokenizer.ParenMismatchException;
					c = b.pop();
					if ("(" !== b.pop()) throw new booleanfiltertokenizer.ParenMismatchException;
					b.push(c);
					break;
				case booleanfiltertokenizer.NOT_ID:
					b.push(new booleanfiltertokenizer.Node(null, c.operation, this._exp(a, b)));
					break;
				case booleanfiltertokenizer.AND_ID:
				case booleanfiltertokenizer.OR_ID:
					if (0 === b.length) throw new booleanfiltertokenizer.MissingOperandException(c.operation);
					var e = b.pop();
					if ("number" !== typeof e) throw new booleanfiltertokenizer.MissingOperandException(c.operation);
					b.push(new booleanfiltertokenizer.Node(e, c.operation, this._exp(a, b)));
					break;
				default:
					throw new booleanfiltertokenizer.UnexpectedTokenException;
			}
		}
		c = b.pop();
		if ("(" === c) throw new booleanfiltertokenizer.ParenMismatchException(this.index);
		return c
	}
};