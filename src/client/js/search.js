import {toast} from "./utils.js";

export const search = async (val) => {
    const response = await fetch('/search', {
        method: 'POST',
        body: JSON.stringify({
            search: val
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const result = await response.json();

    if (!result.ok) {
        toast("No data found by your request!", "warning")
        return false
    }

    window.location.href = '/' + result.target + '/' + result.value
    return true
}

export const submitSearchForm = async form => {
    const val = form.elements['search_val'].value.trim()
    if (!val) {
        toast("Please, enter a data for search!")
        return false
    }
    await search(val)
}