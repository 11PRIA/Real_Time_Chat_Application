import React from 'react'
import "./list.css"
import Chatlist from './chatList/Chatlist'
import Userinfo from './userInfo/Userinfo'


const List = () => {
  return (
    <div className='list'>
        <Userinfo/>
        <Chatlist/>

    </div>
  )
}

export default List