let n = window.navigator;
let things = [

]
for (let i in n) {
  console.log(n[i]);
}

function serializeNavigator() {
  let n = window.navigator;
  let obj = {};
  let props = [
    "vendor",
    "vendorSub",
    "productSub",
    "buildID",
    "appCodeName",
    "appName",
    "appVersion",
    "platform",
    "userAgent",
    "product",
    "language",
    "languages"
  ];
  for (let i=0; i<props.length; i++) {
    if (n[props[i]]!==undefined) {
      obj[props[i]] = n[props[i]];
    }
  }
  return JSON.stringify(obj);
}
