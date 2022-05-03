let darkMode = $.dark

const storedDarkMode = Metro.storage.getItem("darkMode")
if (typeof storedDarkMode !== "undefined") {
    darkMode = storedDarkMode
}

if (darkMode) {
    $("html").addClass("dark-mode")
}

$(".light-mode-switch, .dark-mode-switch").on("click", () => {
    darkMode = !darkMode
    Metro.storage.setItem("darkMode", darkMode)
    if (darkMode) {
        $("html").addClass("dark-mode")
    } else {
        $("html").removeClass("dark-mode")
    }
})
