let debounceTimer;
export const debounce = function (fn, delay) {
  return function () {
    let context = this
    let args = arguments
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(function () {
      fn.apply(context, args)
    }, delay)
  }
}

let throttlePrev = 0;
export const throttle = function (fn, delay) {
  return function () {
    const context = this;
    const args = arguments;
    const now = Date.now();
    if (now - throttlePrev > delay) {
      fn.apply(context, args);
      throttlePrev = Date.now();
    }
  }
}