// STARTUP /////////////////////////////////////////////////////////////////////

createBackup(core)

if (getLocal() === null) {
    setLocal(core)
}

// VUE.JS //////////////////////////////////////////////////////////////////////

app = new Vue({
    el: "#app",
    data: {
        core: getLocal()
    },
    watch: {
        core: {
            handler: _.debounce(function() {
                setLocal(app.core)
                console.log("woo?")
            }, 750),
            deep: true
        }
    },
    methods: {
        resetEverything: function() {
            app.core = restoreBackup()
        },
        updateEMT: function(event) {
            target = event.path[0].getAttribute("value")
            type = event.path[0].getAttribute("type")
            app.core.emt_current.src = target
            app.core.emt_current.type = type
            app.core.emt.forEach(function(el) {
                el.current = (el.src === target)
            })
            console.log(target)
        }
    }
})
