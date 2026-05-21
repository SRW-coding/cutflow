import type { JQueryStatic } from 'jquery';

declare function initSelect2(root: Window, jQuery: JQueryStatic): JQueryStatic;

declare module 'select2' {
  export default initSelect2;
}

interface Select2Options {
  placeholder?: string;
  allowClear?: boolean;
  width?: string;
  closeOnSelect?: boolean;
  dropdownParent?: JQuery;
  dropdownCssClass?: string;
}

interface JQuery {
  select2(options?: Select2Options): JQuery;
  select2(method: 'destroy'): JQuery;
}
