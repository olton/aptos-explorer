const copy2clipboard = (text) => {
    // navigator.clipboard.writeText(text)
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
}

$("body").on("click", " .copy-data-to-clipboard", function() {
    copy2clipboard($(this).attr("data-value"));
    toast("Data copied to clipboard!")
})
