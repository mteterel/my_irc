function formatChannelName(str) {
    if (false === str.startsWith("#")) {
        str = "#" + str.trim();
    }

    return str;
}
module.exports = {formatChannelName};
