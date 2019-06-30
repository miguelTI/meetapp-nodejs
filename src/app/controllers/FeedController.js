import { Op } from 'sequelize';
import { parseISO, startOfHour, addHours, endOfDay } from 'date-fns';
import Meetup from '../models/Meetup';

class FeedController {
  async index(req, res) {
    const { date, page = 1 } = req.query;

    const minimumDate = addHours(startOfHour(parseISO(date)), 1);
    const maximumDate = endOfDay(parseISO(date));

    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [minimumDate, maximumDate],
        },
        user_id: {
          [Op.not]: req.userId,
        },
      },
      offset: (page - 1) * 10,
    });

    return res.json(meetups);
  }
}

export default new FeedController();
