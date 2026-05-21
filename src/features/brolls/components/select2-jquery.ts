/**
 * Select2 registers as a jQuery plugin via UMD. With Vite/ESM, `import 'select2'`
 * does not attach to the same jQuery instance as `import $ from 'jquery'`.
 * Call the factory once so `$.fn.select2` is available.
 */
import $ from 'jquery';
import initSelect2 from 'select2';

type Select2JQueryFactory = (root: Window, jQuery: JQueryStatic) => JQueryStatic;

const attachSelect2 = initSelect2 as unknown as Select2JQueryFactory;

if (typeof $.fn.select2 !== 'function') {
  attachSelect2(window, $);
}

export { $ };
