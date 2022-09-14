// rewrite alpha channel from arr1 to arr2
function replaceAlpha(src, dest) {
  if (src.length !== dest.length) {
    throw Error("Array size length should be equal");
  }
  for (let i = 3; i < src.length; i += 4) {
    dest[i] = src[i];
  }
  return dest;
}

onmessage = (e) => {
  const result = replaceAlpha(e.data.src, e.data.dest);
  postMessage({ result }, [result.buffer]);
};
