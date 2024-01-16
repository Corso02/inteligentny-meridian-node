const server_url = "http://localhost:3000"

let loginBtn = document.getElementById("login_btn")
let logoutBtn = document.getElementById("logout_btn")

if(loginBtn)
	loginBtn.addEventListener("click", handle_login_btn_click)



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

		let req_body = {
			name,
			password
		}

		//req_body = Object.entries(req_body).map(([key,value]) => `${key}=${value}`).join("&")

        const res = await fetch(`${server_url}/user/login`, {
            method: "POST",
            headers: {"Content-type": "application/json; charset=UTF-8"},
            body: JSON.stringify(req_body)
        })

		const ans = await res.json()

		if(!ans.success){
			Swal.fire({
				icon: "error",
				title: "Neplatné prihlasovacie údaje"
			})
		}
		else{
			let login_btn = document.getElementById("login_btn")
			login_btn.innerHTML = "Odhlásiť sa"
			login_btn.removeEventListener("click", handle_login_btn_click)
			login_btn.addEventListener("click", handle_logout_btn_click)
			
			Cookies.set("loggedIn", true)

			if(ans.is_admin){
				console.log("JE TO ADMIN")
				Cookies.set('isAdmin', true)
				addAdminPanelButton()
			}
			else{
				console.log("NIE JE TO ADMIN")
				Cookies.set("isAdmin", false)
			}
		}

    }
}

async function handle_logout_btn_click(){
	Cookies.set("loggedIn", false)
	Cookies.set("isAdmin", false)
	
	let login_btn = document.getElementById("login_btn")
	login_btn.innerHTML = "Prihlásiť sa"
	login_btn.removeEventListener("click", handle_logout_btn_click)
	login_btn.addEventListener("click", handle_login_btn_click)
	removeAdminPanelButton()
}

function addAdminPanelButton(){
	let adminPanelBtn = document.createElement("a")
	adminPanelBtn.setAttribute("id", "admin_panel_btn")
	adminPanelBtn.innerHTML = "Admin panel"
	document.getElementById("login_btn").parentNode.insertBefore(adminPanelBtn, document.getElementById("login_btn"))
}

function removeAdminPanelButton(){
	let admin_panel_btn = document.getElementById("admin_panel_btn")
	if(admin_panel_btn){
		admin_panel_btn.remove()
	}
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

