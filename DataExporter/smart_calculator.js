function tickCheckBox(box)
{
    const Containers = document.querySelectorAll('.container-grid-fivecolumn');

    for (const container of Containers)
    {
        const CheckBox = container.querySelector('.databool');
        const DestinationData = container.querySelector('.destinationdata');
        if (box == CheckBox && box.checked)
        {
            DestinationData.disabled = false;
        }
        else
        {
            CheckBox.checked = false;
            DestinationData.disabled = true;
            DestinationData.value = "";
        }
    }
}