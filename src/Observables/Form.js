import { observable, computed, action } from 'mobx';
import getNested from 'get-nested';
import Field from './Field';

class Form {

  /**
   * The unique key for this form.
   */
  key = null;

  /**
   * The raw data provided by Drupal.
   */
  form;

  @observable settings = {};

  /**
   * All fields in this form.
   * @type {Array.<Field>}
   */
  @observable fields = [];

  @observable page = 'no-page';

  /**
   * All visible fields in this form.
   * @type {Array.<Field>}
   */
  @computed get visibleFields() {
    return this.fields.filter(field => field.visible);
  }

  /**
   * All visible fields in this form of the current page.
   * @type {Array.<Field>}
   */
  @computed get visibleFieldsOfCurrentPage() {
    return this.visibleFields.filter(field => field.page === this.page);
  }


  constructor(formId, { settings, form, defaultValues = {} }) {
    this.key = formId;
    this.form = form;
    this.settings = settings;

    // Create all fields.
    this.form.elements.forEach(element => this.createField(element));

    // Set all default values.
    Object.keys(defaultValues).forEach((key) => {
      const field = this.getField(key);
      if(field) field.value = defaultValues[key];
    });

    // Start at the first page
    const page = this.fields.find(f => f.page !== 'no-page');
    if(page) this.page = page.page;
  }

  @action.bound
  createField(element, parent) {
    const field = new Field(this, element, parent);
    if(field.componentClass) this.fields.push(field);

    // If it has children, create them too.
    if(element.composite_elements) {
      element.composite_elements.forEach(e => this.createField(e, field));
    }
  }

  /**
   * @param key
   * @returns {Field}
   */
  getField(key) {
    return this.fields.find(field => field.key === key);
  }

  @computed get values() {
    const values = {};

    this.visibleFields.filter(field => !field.isEmpty).forEach((field) => {
      values[field.key] = typeof field.componentClass.rewriteValue === 'function' ? field.componentClass.rewriteValue(field.value, values) : field.value;
    });

    return values;
  }

  @computed get valid() {
    return !this.fields.find(field => field.visible && !field.valid);
  }

  isValid(page) {
    const invalid = this.fields.find((field) => {
      // Only check the current page
      if(!field.component || field.component.props.webformPage !== page) return false;

      // If an error was found, return true
      return !field.valid;
    });

    // If an error was found, return false
    return !invalid;
  }

  @computed get tokens() {
    const tokens = {};
    this.fields.forEach((field) => {
      tokens[field.key] = field.value;
      if(typeof field.componentClass.getTokens === 'function') {
        Object.assign(tokens, field.componentClass.getTokens(this, field));
      }
    });
    return tokens;
  }

  @observable isSubmitting = false;

  @action.bound
  isMultipage() {
    return (getNested(() => this.form.elements) || []).find(element => element['#webform_key'] === 'wizard_pages') !== undefined;
  }

}

export default Form;
