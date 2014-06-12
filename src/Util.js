var isMobile = {
    android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    blackberry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    ios: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.android() || isMobile.blackberry() || isMobile.ios() || isMobile.opera() || isMobile.windows());
    }
};