var blab, last, obj_first;

blab = function() {
  return console.log(arguments);
};

last = function(list) {
  return list[list.length - 1];
};

obj_first = function(obj) {
  var item, key;
  for (key in obj) {
    item = obj[key];
    return item;
  }
};