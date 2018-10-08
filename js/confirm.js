var userId;

window.onload = function (e) {
    // liff.init(function (data) {
    //     userId = data.context.userId;
    // });
}

function showReservedTime() {
    $("#cancelSelectedDateButton").prop("disabled", true);
    document.getElementById('reservedTimeModalTitle').innerText = `ご予約内容の確認`;
    document.getElementById('reservedTimeModalBody').innerText = '取得しています...';
    $("#reservedTimeModal").modal();

    liff.init(function (data) {
        userId = data.context.userId;
        $.ajax({
            type: 'GET',
            url: 'https://bashotori.herokuapp.com/users/' + userId + "/reservations",
            dataType: 'json'
        }).then((data, textStatus, jqXHR) => {
            console.log('done: ', jqXHR.status);
            if (data.reservations.length == 0) {
                modalBody = `現在、予約はありません。`;
            } else {
                var modalBody = '<div class="btn-group btn-group-toggle btn-group-vertical btn-block" data-toggle="buttons" id="filterReservedTime">';
                // TODO: Sort by reserved time
                $.each(data.reservations, (i, v) => {
                    const productInfo = v.productInfo;
                    modalBody += `<label class="btn btn-outline-secondary"> \
                <input type="radio" name="options" id="option${i}" autocomplete="off" value="${v.reservationId}"> \
                ${productInfo.placeName}<br>${productInfo.year}年${productInfo.month}月${productInfo.day}日 ${productInfo.time}</label>`
                });
                modalBody += '</div>';
            }
            document.getElementById('reservedTimeModalBody').innerHTML = modalBody;
            $(function () {
                $('#filterReservedTime input[type=radio]').change(function () {
                    $("#cancelSelectedDateButton").prop("disabled", false);
                });
            })
        }).catch((jqXHR, textStatus, errorThrown) => {
            console.log('fail', jqXHR.status);
            window.alert('Error: ' + errorThrown);
        });
    });
}

function confirmCancellation() {
    document.getElementById("selectedReservation").innerText = `${$('#filterReservedTime input:radio:checked').parent('label').text()}`;
    $("#cancelConfirmationModal").modal();
}

function cancelReservation() {
    // TODO: Show "Cancellation in progress..." like message
    const reservationId = _getSelectedReservationId();
    $.ajax({
        type: 'DELETE',
        url: `https://bashotori.herokuapp.com/users/${userId}/reservations/${reservationId}`
    }).then((data, textStatus, jqXHR) => {
        $("#cancelCompletedModal").modal();
    }).catch((jqXHR, textStatus, errorThrown) => {
        console.log('fail', jqXHR.status);
        window.alert('Error: ' + errorThrown);
    });
}

function closeWindow() {
    liff.closeWindow();
}

function _getSelectedReservationId() {
    return $('#filterReservedTime input:radio:checked').val();
}
