const server_url = "http://localhost:3000"

let loginBtn = document.getElementById("login_btn")
let logoutBtn = document.getElementById("logout_btn")

if(loginBtn)
	loginBtn.addEventListener("click", handle_login_btn_click)

if(logoutBtn)
	logoutBtn.addEventListener("click", handle_logout_btn_click)



async function testConn(){
	let res = await fetch(server_url)
	let ans = await res.text()
	console.log(ans)
}

testConn()

async function handle_login_btn_click(){
	const { value: formValues } = await Swal.fire({
    	title: "Zadajte prihlasovacie údaje",
        confirmButtonColor: "dodgerblue",
		confirmButtonText: "Prihlásiť sa",
        html: `
          <input id="swal-input1" class="swal2-input" placeholder="Meno" type="text">
          <input id="swal-input2" class="swal2-input" placeholder="Heslo" type="password">
        `,
        focusConfirm: false,
        preConfirm: () => {
			let name = document.getElementById("swal-input1").value
			let pswd = document.getElementById("swal-input2").value
			let errorClass = "swal2-input error_input"
			let normalClass = "swal2-input"
			if(!name || !pswd){
				if(!name){
					document.getElementById("swal-input1").setAttribute("class", errorClass)
				}
				else{
					document.getElementById("swal-input1").setAttribute("class", normalClass)
				}
				if(!pswd){
					document.getElementById("swal-input2").setAttribute("class", errorClass)
				}
				else{
					document.getElementById("swal-input2").setAttribute("class", errorClass)
				}
				
				return false
			}
          	return [ name, pswd ];
        }
    });
	if (formValues) {
    	let name = formValues[0]
		let password = formValues[1]
		let login = true

		let req_body = {
			login,
			name,
			password
		}

		req_body = Object.entries(req_body).map(([key,value]) => `${key}=${value}`).join("&")

        const res = await fetch("../backend/API.php", {
            method: "POST",
            headers: {"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"},
            body: req_body
        })

		const ans = await res.json()

		if(!ans.success){
			Swal.fire({
				icon: "error",
				title: "Neplatné prihlasovacie údaje"
			})
		}
		else{
			location.reload()
		}

    }
}

async function handle_logout_btn_click(){
	let req_body = "logout=true"
	const res = await fetch("../backend/API.php", {
		method: "POST",
		headers: {"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"},
		body: req_body
	})
	location.reload()

}

document.getElementById("test_mqtt").addEventListener("click", async () => {
	console.log("test")

	const res = await fetch(`${server_url}/current_values`)
	const ans = await res.json()

	if(ans){
		let temp = 0
		let light = 0
		let doors = 0
		for(let i = 0; i < ans.length; i++){
			switch(ans[i].measurment_name){
				case "temp":
					temp = ans[i].measurment
					break
				case "light":
					light = ans[i].measurment
					break
				case "doors":
					doors = ans[i].measurment
					break
			}
		}
		Swal.fire({
			icon: 'info',
			html: `<p>Teplota: ${temp} °C</p><br><p>Svetlo: ${light} lux</p><br><p>Dvere: ${doors ? "otvorené" : "zatvorené" }</p>`
		})
	}

})