import React, { PropTypes } from 'react';
import uncontrollable from 'uncontrollable';
import cn from 'classnames';
import {
    accessor
  , elementType
  , dateFormat
  , views as componentViews } from './utils/propTypes';

import localizer from './localizer'
import { notify } from './utils/helpers';
import { navigate, views } from './utils/constants';
import dates from './utils/dates';
import defaultFormats from './formats';
import viewLabel from './utils/viewLabel';
import moveDate from './utils/move';
import VIEWS from './Views';
import Toolbar from './Toolbar';

import omit from 'lodash/object/omit';
import defaults from 'lodash/object/defaults';

function viewNames(_views){
  return !Array.isArray(_views) ? Object.keys(_views) : _views
}

function isValidView(view, { views: _views }) {
  let names = viewNames(_views)
  return names.indexOf(view) !== -1
}

let now = new Date();


let Calendar = React.createClass({

  propTypes: {
    /**
     * The current date value of the calendar. Determines the visible view range
     */
    date: PropTypes.instanceOf(Date),

    /**
     * An array of event objects to display on the calendar
     */
    events: PropTypes.arrayOf(PropTypes.object),

    /**
     * Callback fired when the `date` value changes.
     */
    onNavigate: PropTypes.func,

    /**
     * A callback fired when a date selection is made.
     *
     * ```js
     * function(
     *   slotInfo: object {
     *     start: date,
     *     end: date,
     *     slots: array<date>
     *   }
     * )
     * ```
     */
    onSelectSlot: PropTypes.func,

    /**
     * Callback fired when an event node is selected.
     *
     * ```js
     * function(event: object)
     * ```
     */
    onSelectEvent: PropTypes.func,

    /**
     * An array of built in view names
     */
    views: componentViews,

    /**
     * Determines whether the toolbar is displayed
     */
    toolbar: PropTypes.bool,

    /**
     * Show truncated events in an overlay when you click the "+_x_ more" link.
     */
    popup: PropTypes.bool,

    /**
     * Distance in pixels, from the edges of the viewport, the "show more" overlay should be positioned.
     *
     * ```js
     * <BigCalendar popupOffset={30}/>
     * <BigCalendar popupOffset={{x: 30, y: 20}}/>
     * ```
     */
    popupOffset: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({ x: PropTypes.number, y: PropTypes.number })
    ]),
    /**
     * Allows mouse selection of ranges of dates/times.
     */
    selectable: PropTypes.bool,

    /**
     * Optionally provide a function that returns an object of className or style props
     * to be applied to the the event node.
     *
     * ```js
     * function(
     * 	event: object,
     * 	start: date,
     * 	end: date,
     * 	isSelected: bool
     * ) -> { className: string?, style: object? }
     * ```
     */
    eventPropGetter: PropTypes.func,

    /**
     * Accessor for the event title, used to display event information. Should
     * resolve to a `renderable` value.
     *
     * @type {(func|string)}
     */
    titleAccessor: accessor,

    /**
     * Determines whether the event should be considered an "all day" event and ignore time.
     * Must resolve to a `boolean` value.
     *
     * @type {(func|string)}
     */
    allDayAccessor: accessor,

    /**
     * The start date/time of the event. Must resolve to a JavaScript `Date` object.
     *
     * @type {(func|string)}
     */
    startAccessor: accessor,

    /**
     * The end date/time of the event. Must resolve to a JavaScript `Date` object.
     *
     * @type {(func|string)}
     */
    endAccessor: accessor,

    formats: PropTypes.shape({
      /**
       * Format for the day of the month heading in the Month view.
       */
      dateFormat,

      /**
       * A day of the week format for Week and Day headings
       */
      dayFormat: dateFormat,
      /**
       * Week day name format for the Month week day headings.
       */
      weekdayFormat: dateFormat,

      /**
       * Toolbar header format for the Month view.
       */
      monthHeaderFormat: dateFormat,
      /**
       * Toolbar header format for the Week views.
       */
      weekHeaderFormat: dateFormat,
      /**
       * Toolbar header format for the Day view.
       */
      dayHeaderFormat: dateFormat,

      /**
       * Toolbar header format for the Agenda view.
       */
      agendaHeaderFormat: dateFormat,

      /**
       * A time range format for selecting time slots.
       */
      selectRangeFormat: dateFormat,


      agendaDateFormat: dateFormat,
      agendaTimeFormat: dateFormat,
      agendaTimeRangeFormat: dateFormat
    }),

    components: PropTypes.shape({
      event: elementType,

      agenda: PropTypes.shape({
        date: elementType,
        time: elementType,
        event: elementType
      }),

      day: PropTypes.shape({ event: elementType }),
      week: PropTypes.shape({ event: elementType }),
      month: PropTypes.shape({ event: elementType })
    }),

    /**
     * String messages used throughout the component, override to provide localizations
     */
    messages: PropTypes.shape({
      allDay: PropTypes.string,
      previous: PropTypes.string,
      next: PropTypes.string,
      today: PropTypes.string,
      month: PropTypes.string,
      week: PropTypes.string,
      day: PropTypes.string,
      agenda: PropTypes.string,
      showMore: PropTypes.func
    })
  },

  getDefaultProps() {
    return {
      popup: false,
      toolbar: true,
      view: views.MONTH,
      views: [views.MONTH, views.WEEK, views.DAY, views.AGENDA],
      date: now,

      titleAccessor: 'title',
      allDayAccessor: 'allDay',
      startAccessor: 'start',
      endAccessor: 'end'
    };
  },

  render() {
    let {
        view, toolbar, events
      , culture
      , components = {}
      , formats = {}
      , style
      , className
      , date: current
      , ...props } = this.props;

    formats = defaultFormats(formats)

    let View = VIEWS[view];
    let names = viewNames(this.props.views)

    let elementProps = omit(this.props, Object.keys(Calendar.propTypes))

    let viewComponents = defaults(
      components[view] || {},
      omit(components, names)
    )

    return (
      <div {...elementProps}
        className={cn('rbc-calendar', className)}
        style={style}
      >
        { toolbar &&
          <Toolbar
            date={current}
            view={view}
            views={names}
            label={viewLabel(current, view, formats, culture)}
            onViewChange={this._view}
            onNavigate={this._navigate}
            messages={this.props.messages}
          />
        }
        <View
          ref='view'
          {...props}
          {...formats}
          formats={undefined}
          events={events}
          date={current}
          components={viewComponents}
          onNavigate={this._navigate}
          onHeaderClick={this._headerClick}
          onSelectEvent={this._select}
          onSelectSlot={this._selectSlot}
          onShowMore={this._showMore}
        />
      </div>
    );
  },

  _navigate(action, newDate) {
    let { view, date, onNavigate } = this.props;

    date = moveDate(action, newDate || date, view)

    onNavigate(date, view)

    if (action === navigate.DATE)
      this._viewNavigate(date)
  },

  _viewNavigate(nextDate){
    let { view, date, culture } = this.props;

    if (dates.eq(date, nextDate, view, localizer.startOfWeek(culture))) {
      this._view(views.DAY)
    }
  },

  _view(view){
    if (view !== this.props.view && isValidView(view, this.props))
      this.props.onView(view)
  },

  _select(event){
    notify(this.props.onSelectEvent, event)
  },

  _selectSlot(slotInfo){
    notify(this.props.onSelectSlot, slotInfo)
  },

  _headerClick(date){
    let { view } = this.props;

    if ( view === views.MONTH || view === views.WEEK)
      this._view(views.day)

    this._navigate(navigate.DATE, date)
  }
});

export default uncontrollable(Calendar, { view: 'onView', date: 'onNavigate', selected: 'onSelectEvent' })
