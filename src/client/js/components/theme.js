const lightLogo = `/images/aptos_word_light.svg`
const darkLogo = `/images/aptos_word.svg`
let darkMode = $.dark

const storedDarkMode = Metro.storage.getItem("darkMode")
if (typeof storedDarkMode !== "undefined") {
    darkMode = storedDarkMode
}

if (darkMode) {
    $("html").addClass("dark-mode")
    $(".aptos-logo img").attr("src", lightLogo)
}

$(".light-mode-switch, .dark-mode-switch").on("click", () => {
    darkMode = !darkMode
    Metro.storage.setItem("darkMode", darkMode)
    if (darkMode) {
        $("html").addClass("dark-mode")
        $(".aptos-logo img").attr("src", lightLogo)
    } else {
        $("html").removeClass("dark-mode")
        $(".aptos-logo img").attr("src", darkLogo)
    }
})
