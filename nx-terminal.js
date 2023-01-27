const axios = require("axios");

class NxTerminal {
	constructor() {}

	async predict(text) {
		return axios({
      url: process.env.NXT_URL,
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify({
        "fn_index": 0,
        "data": [ text ]
      })
    }).then(r => r.data.data[0]).catch(err => console.log(err))
	}
}

module.exports = NxTerminal;