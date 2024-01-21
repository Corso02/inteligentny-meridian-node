const btn = document.querySelector(".hamburger")
const navbar = document.querySelector(".nav-menu")

btn.addEventListener("click", () => {
    console.log("otvaram")
    btn.classList.toggle("active")
    navbar.classList.toggle("active")
})