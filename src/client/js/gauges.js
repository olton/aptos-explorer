import {n2f} from "./utils.js";

const areaDefaultOptions = {
    axis: {
        x: {
            line: {
                color: "#fafbfc",
                shortLineSize: 0
            },
            label: {
                count: 10,
                fixed: 0,
                color: "#24292e",
                font: {
                    size: 10
                }
            },
            skip: 2,
        },
        y: {
            line: {
                color: "#fafbfc"
            },
            label: {
                count: 10,
                fixed: 1,
                color: "#24292e",
                font: {
                    size: 10
                },
                skip: 2,
                align: "left",
                shift: {
                    x: 20
                },
                showMin: false,
                showLabel: false,
                step: 10
            }
        }
    },
    border: false,
    legend: {
        vertical: true,
        position: "top-right",
        margin: {
            top: 10
        },
        border: {
            color: 'transparent'
        }
    },
}

export const drawGaugeTransactionsPerMinute = (target, data = [], color = '#458fff') => {
    const points = []

    let max = 0
    let min = 10_000_000

    let index = 1
    for(let r of data.reverse()) {
        if (index === 61) continue
        const m = +(r.count)
        points.push([index, m])
        if (m > max) max = m
        if (m < min) min = m
        index++
    }

    const maxY = Math.round(max * 1.2)
    const minY = 0

    const areas = [
        {
            name: "Trans per minute",
            dots: false,
            size: 2
        }
    ]

    chart.areaChart(target, [points], {
        ...areaDefaultOptions,
        background: darkMode ? '#1e2228' : '#ffffff',
        areas,
        colors: [Metro.colors.toRGBA(color, .5)],
        padding: {
            top: 10,
            left: 40,
            right: 1,
            bottom: 5
        },
        legend: false,
        height: 120,
        axis: {
            y: {
                showLabel: true,
                label: {
                    count: 5,
                    step: 'auto',
                    fixed: 0,
                    font: {
                        size: 10
                    },
                    color: darkMode ? '#adbaa9' : '#000000'
                },
                line: {
                    color: darkMode ? '#444c56' : '#d9d9d9'
                }
            },
            x: {
                line: {
                    color: darkMode ? '#444c56' : '#d9d9d9'
                },
                label: {
                    count: 10
                }
            }
        },
        boundaries: {
            maxY,
            minY
        },
        onTooltipShow: (d) => {
            return `<span class="text-bold">${n2f(d[1])} <small class="text-light">TRANS</small></span>`
        }
    })

    $(target).siblings(".min-max").find('.max-value').text(n2f(max))
    $(target).siblings(".min-max").find('.min-value').text(n2f(min))
}
