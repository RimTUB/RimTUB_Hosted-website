import DarkModal from 'darkmodal'
import 'darkmodal/dist/darkmodal.min.css'

const darkModal = new DarkModal({
  isOpen: () => {
    console.log('Открыто')
  },
  isClose: () => {
    console.log('Закрыто')
  }
})