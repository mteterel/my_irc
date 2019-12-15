function formatChannelName(str) {
    if (str === null)
        return null;

    if (false === str.startsWith("#")) {
        str = "#" + str.trim();
    }

    return str;
}
module.exports = {formatChannelName};
