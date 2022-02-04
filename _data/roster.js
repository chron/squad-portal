const isWithinInterval = require('date-fns/isWithinInterval');
const endOfDay = require('date-fns/endOfDay')
const parseISO = require('date-fns/parseISO');

module.exports = [
  {
    title: 'Cooldown Week 1',
    dates: {
      start: '2022-01-25',
      end: '2022-01-28',
    },
    main: 'sandemchad',
    backup: 'timothyjohn2015',
  },
  {
    title: 'Cooldown Week 2',
    dates: {
      start: '2022-01-31',
      end: '2022-02-04',
    },
    main: 'sandemchad',
    backup: 'timothyjohn2015',
  },
  {
    title: 'Cycle week 1',
    dates: {
      start: '2022-02-08 ',
      end: '2022-02-11',
    },
    main: 'timothyjohn2015',
    backup: 'fourseven',
  },
  {
    title: 'Cycle week 2',
    dates: {
      start: '2022-02-14',
      end: '2022-02-18',
    },
    main: 'timothyjohn2015',
    backup: 'fourseven',
  },
  {
    title: 'Cycle week 3',
    dates: {
      start: '2022-02-21',
      end: '2022-02-25',
    },
    main: 'fourseven',
    backup: 'libbyschuknight',
  },
  {
    title: 'Cycle week 4',
    dates: {
      start: '2022-02-28',
      end: '2022-03-04',
    },
    main: 'fourseven',
    backup: 'libbyschuknight',
  },
  {
    title: 'Cycle week 5',
    dates: {
      start: '2022-03-07',
      end: '2022-03-11',
    },
    main: 'libbyschuknight',
    backup: 'sandemchad',
  },
  {
    title: 'Cycle week 6',
    dates: {
      start: '2022-03-14',
      end: '2022-03-18',
    },
    main: 'libbyschuknight',
    backup: 'sandemchad',
  },
  {
    title: 'Cooldown week 1',
    dates: {
      start: '2022-03-21',
      end: '2022-03-25',
    },
    main: 'sandemchad',
    backup: 'timothyjohn2015',
  },
  {
    title: 'Cooldown week 2',
    dates: {
      start: '2022-03-28',
      end: '2022-04-01',
    },
    main: 'sandemchad',
    backup: 'timothyjohn2015',
  },
].map(d => ({
  ...d,
  current: isWithinInterval(new Date(), {
    start: parseISO(d.dates.start),
    end: endOfDay(parseISO(d.dates.end)) }),
}));
