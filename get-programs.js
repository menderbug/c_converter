// var file = require('./c-converter.js');
var axios = require('axios');

axios({
	method: 'get',
	url: 'https://www.studytonight.com/c/programs/',
	responseType: 'text'
})
	.then(res => {
		console.log(res.data);
	})

