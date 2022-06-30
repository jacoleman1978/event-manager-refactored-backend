const updatedOpenInvitations = (invitedList, usersToRemove) => {
    const updatedList = invitedList.filter(id => {
        return !usersToRemove.includes(id)
    })
    return updatedList
}

export default updatedOpenInvitations;