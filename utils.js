const idGenerator = () => {
  return "_" + Math.random().toString(36).substr(2, 9);
};

const formatDate = (e = new Date()) => new Date(e).toISOString().split("T")[0];

const hasDuplicates = (array) => {
  return new Set(array).size !== array.length;
};

module.exports = { idGenerator, formatDate, hasDuplicates };
