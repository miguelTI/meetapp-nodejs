import Meetup from '../models/Meetup';
import File from '../models/File';

class DashboardController {
  async index(req, res) {
    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
      order: ['date'],
    });

    return res.json(meetups);
  }
}

export default new DashboardController();
